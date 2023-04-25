using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class GeneralElectionDebate : MonoBehaviour
{

    public GameObject prefab;
    public int numIssues = 5;
    public HashSet<int> hs = new HashSet<int>();
    public TextAsset txt;
    public List<GameObject> candidates;
    public List<GameObject> objectsToDestroy;
    public GameObject yesText;
    public GameObject noText;
    public GameObject instance;
    public int[] values;
    public List<string> lines;
    public int n;
    public int counter = 0;
    public int debateTotal = 3;
    public List<GameObject> objectsToActivate;
    public List<GameObject> objectsToDeactivate;
    public float randomTarget = 0.75f;

    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("DebateQuestions", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        n = lines.Count();
    }

    void OnEnable() 
    {
        TextAsset txt = (TextAsset)Resources.Load("DebateQuestions", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        n = lines.Count();
        bool partyType = (bool)Variables.Saved.Get("Democrats");
        int rivalAnswerMod = 0;
        if (counter < numIssues)
        {
            int r = Random.Range(0, n-1);
            while (hs.Contains(r)) 
            {
                r = Random.Range(0, n-1);
            }
            hs.Add(r);
            List<string> l = new List<string>(lines[r].Split('\t').ToList());
            float liberal = (float.Parse(l[1])/1f);
            float libertarian = (float.Parse(l[2])/1f);
            float owner = (float.Parse(l[3])/1f);
            float worker = (float.Parse(l[4])/1f);
            float religious = (float.Parse(l[5])/1f);
            float immigrant = (float.Parse(l[6])/1f);
            foreach(GameObject g in candidates)
            {
                float rnum = Random.value;
                if (rnum < (1-randomTarget))
                {
                    if (partyType && (float.Parse(l[1])) >= 0) 
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = 1;
                    }
                    else if (partyType)
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = -1;
                    }
                    else if (!partyType && (float.Parse(l[3])) >= 0)
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = 1;
                    }
                    else
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = -1;
                    }
                }
                else
                {
                    if (partyType && (float.Parse(l[1])) >= 0) 
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = -1;
                    }
                    else if (partyType)
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = 1;
                    }
                    else if (!partyType && (float.Parse(l[3])) >= 0)
                    {
                        instance = Instantiate(noText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = -1;
                    }
                    else
                    {
                        instance = Instantiate(yesText, g.transform);
                        objectsToDestroy.Add(instance);
                        rivalAnswerMod = 1;
                    }
                }
            }
            Variables.Saved.Set("gLiberal", (float)Variables.Saved.Get("gLiberal") + liberal * rivalAnswerMod);
            Variables.Saved.Set("gLibertarian", (float)Variables.Saved.Get("gLibertarian") + libertarian * rivalAnswerMod);
            Variables.Saved.Set("gOwners", (float)Variables.Saved.Get("gOwners") + owner * rivalAnswerMod);
            Variables.Saved.Set("gWorkers", (float)Variables.Saved.Get("gWorkers") + worker * rivalAnswerMod);
            Variables.Saved.Set("gReligious", (float)Variables.Saved.Get("gReligious") + religious * rivalAnswerMod);
            Variables.Saved.Set("gImmigrants", (float)Variables.Saved.Get("gImmigrants") + immigrant * rivalAnswerMod);
            instance = Instantiate(prefab, transform);
            instance.GetComponentInChildren<TextMeshProUGUI>().text = l[0];
            instance.GetComponent<DebateQuestion>().liberal = liberal;
            instance.GetComponent<DebateQuestion>().libertarian = libertarian;
            instance.GetComponent<DebateQuestion>().immigrant = immigrant;
            instance.GetComponent<DebateQuestion>().owner = owner;
            instance.GetComponent<DebateQuestion>().worker = worker;
            instance.GetComponent<DebateQuestion>().religious = religious;
            counter++;
        }
        else
        {
            int debateCount = (int)Variables.Saved.Get("generalDebates");
            debateCount++;
            foreach (GameObject g in objectsToActivate)
            {
                g.SetActive(true);
            }
            foreach (GameObject g in objectsToDeactivate)
            {
                g.SetActive(false);
            }
            Variables.Saved.Set("generalDebates", debateCount);
        }
    }

    void OnDisable()
    {
        foreach (GameObject g in objectsToDestroy)
        {
            Destroy(g);
        }
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}

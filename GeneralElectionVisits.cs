using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;


public class GeneralElectionVisits : MonoBehaviour
{

    public List<string> lines;
    public TextAsset txt;
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float[][] stateArray = new float[50][];
    public float evToWin = 270f;
    public int statesAbove = 3;
    public int statesBelow = 3;

    // Start is called before the first frame update
    void Start()
    {
        TextAsset txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
        int stateNum = 0;
        for (int i = 0; i < lines.Count; i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            float ev = int.Parse(l[1]);
            liberal = (float.Parse(l[2])/1f);
            libertarian = (float.Parse(l[3])/1f);
            owner = (float.Parse(l[4])/1f);
            worker = (float.Parse(l[5])/1f);
            religious = (float.Parse(l[6])/1f);
            immigrant = (float.Parse(l[7])/1f);
            float playerScore = li*liberal + la*libertarian + ow*owner + wo*worker + re*religious + im*immigrant;
            playerScore /= 2f;
            stateArray[i] = new float[] {i, ev, playerScore};
        }

        float[][] sortedResult = stateArray.OrderBy(x => x[2]).ToArray();

        float evCount = 0;

        while (evCount < evToWin)
        {
            evCount += sortedResult[stateNum][1];
            stateNum++;
        }

        string swingStates = "Swing States: ";

        for (int i = stateNum; i < stateNum + statesAbove; i++)
        {
            List<string> l = new List<string>(lines[(int)sortedResult[i][0]].Split('\t').ToList());
            swingStates = swingStates + " " + l[0] + ",";
        }
        for (int i = stateNum-1; i > stateNum - statesBelow - 1; i--)
        {
            List<string> l = new List<string>(lines[(int)sortedResult[i][0]].Split('\t').ToList());
            if (i != stateNum - statesBelow)
            {
                swingStates = swingStates + " " + l[0] + ",";
            }
            else 
            {
                swingStates = swingStates + " " + l[0];
            }
        }

        gameObject.GetComponentInChildren<TextMeshProUGUI>().text = swingStates;

    }

    

    // Update is called once per frame
    void Update()
    {
        
    }
}

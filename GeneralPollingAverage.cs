using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class GeneralPollingAverage : MonoBehaviour
{
    public List<string> lines;
    public GameObject prefab;
    public TextAsset txt;
    public float li;
    public float la;
    public float re;
    public float ow;
    public float wo;
    public float im;
    public float liberal;
    public float libertarian;
    public float immigrant;
    public float owner;
    public float worker;
    public float religious;
    public float gli;
    public float gla;
    public float gre;
    public float gow;
    public float gwo;
    public float gim;

    // Start is called before the first frame update
    void Start()
    {
        li = (float)Variables.Saved.Get("Liberal");
        la = (float)Variables.Saved.Get("Libertarian");
        wo = (float)Variables.Saved.Get("Workers");
        ow = (float)Variables.Saved.Get("Owners");
        re = (float)Variables.Saved.Get("Religious");
        im = (float)Variables.Saved.Get("Immigrants");
        gli = (float)Variables.Saved.Get("gLiberal");
        gla = (float)Variables.Saved.Get("gLibertarian");
        gwo = (float)Variables.Saved.Get("gWorkers");
        gow = (float)Variables.Saved.Get("gOwners");
        gre = (float)Variables.Saved.Get("gReligious");
        gim = (float)Variables.Saved.Get("gImmigrants");

        TextAsset txt = (TextAsset)Resources.Load("GeneralElection", typeof(TextAsset));
        lines = (txt.text.Split('\n').ToList());
        float playerEV = 0;

        for (int i = 0; i < 50; i++)
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
            float oppScore = gli*liberal + gla*libertarian + gow*owner + gwo*worker + gre*religious + gim*immigrant;
            oppScore /= 2f;

            if (playerScore > oppScore)
            {
                playerEV += ev;
            }
        }

        gameObject.GetComponentInChildren<TextMeshProUGUI>().text = playerEV.ToString() + " Projected EVs";
        gameObject.GetComponentInChildren<Slider>().value = playerEV;
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
